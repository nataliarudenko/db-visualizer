import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';
import { IntrospectionService } from '../introspection/introspection.service';

@Injectable()
export class DataService {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly introspectionService: IntrospectionService,
  ) {}

  private async getPrimaryKeyColumn(tableName: string): Promise<string> {
    const columns = await this.introspectionService.getColumns(tableName);
    const pk = columns.find((c) => c.is_primary_key);
    return pk ? pk.column_name : 'id';
  }

  async getRows(
    tableName: string,
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<{ rows: any[]; total: number; page: number; limit: number }> {
    const pool = this.connectionService.getPool();
    const offset = (page - 1) * limit;

    // Sanitize table name (escape double quotes)
    const safeTable = tableName.replace(/"/g, '""');

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      // Get text columns for search
      const columns = await this.introspectionService.getColumns(safeTable);
      const textColumns = columns
        .filter((c) => ['varchar', 'text', 'char', 'bpchar', 'name'].includes(c.udt_name))
        .map((c) => c.column_name.replace(/"/g, '""'));

      if (textColumns.length > 0) {
        const conditions = textColumns.map(
          (col, i) => `"${col}"::text ILIKE $${i + 1}`,
        );
        whereClause = `WHERE ${conditions.join(' OR ')}`;
        params.push(...textColumns.map(() => `%${search}%`));
      }
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM "${safeTable}" ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await pool.query(
      `SELECT * FROM "${safeTable}" ${whereClause} ORDER BY 1 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return { rows: dataResult.rows, total, page, limit };
  }

  async createRow(tableName: string, data: Record<string, any>): Promise<any> {
    const pool = this.connectionService.getPool();
    const safeTable = tableName.replace(/"/g, '""');

    const keys = Object.keys(data).filter((k) => data[k] !== '' && data[k] !== null && data[k] !== undefined);
    const values = keys.map((k) => data[k]);
    const columns = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO "${safeTable}" (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async updateRow(
    tableName: string,
    id: string | number,
    data: Record<string, any>,
  ): Promise<any> {
    const pool = this.connectionService.getPool();
    const safeTable = tableName.replace(/"/g, '""');
    const pkColumn = await this.getPrimaryKeyColumn(safeTable);

    const keys = Object.keys(data);
    const values = keys.map((k) => data[k]);
    const setClauses = keys
      .map((k, i) => `"${k.replace(/"/g, '""')}" = $${i + 1}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE "${safeTable}" SET ${setClauses} WHERE "${pkColumn}" = $${keys.length + 1} RETURNING *`,
      [...values, id],
    );
    return result.rows[0];
  }

  async deleteRow(tableName: string, id: string | number): Promise<{ deleted: boolean }> {
    const pool = this.connectionService.getPool();
    const safeTable = tableName.replace(/"/g, '""');
    const pkColumn = await this.getPrimaryKeyColumn(safeTable);

    await pool.query(`DELETE FROM "${safeTable}" WHERE "${pkColumn}" = $1`, [id]);
    return { deleted: true };
  }

  async lookup(
    tableName: string,
    search?: string,
    limit: number = 30,
  ): Promise<{ value: any; label: string }[]> {
    const pool = this.connectionService.getPool();
    const safeTable = tableName.replace(/"/g, '""');
    const columns = await this.introspectionService.getColumns(safeTable);

    const pkColumn = columns.find((c) => c.is_primary_key);
    const pkName = pkColumn ? pkColumn.column_name : columns[0]?.column_name || 'id';

    // Find a "display" column — first text column that is not the PK
    const displayColumn = columns.find(
      (c) =>
        ['varchar', 'text', 'char', 'bpchar', 'name'].includes(c.udt_name) &&
        c.column_name !== pkName,
    );
    const displayName = displayColumn ? displayColumn.column_name : pkName;

    let query = `SELECT "${pkName}" as value, "${displayName}"::text as label FROM "${safeTable}"`;
    const params: any[] = [];

    if (search) {
      query += ` WHERE "${displayName}"::text ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY "${displayName}" LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}
