import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  is_primary_key: boolean;
  web_type: string;
}

export interface ForeignKeyInfo {
  constraint_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
}

@Injectable()
export class IntrospectionService {
  constructor(private readonly connectionService: ConnectionService) {}

  // Map PostgreSQL types to web-friendly input types
  private mapToWebType(udtName: string): string {
    const typeMap: Record<string, string> = {
      // Numeric
      int2: 'number',
      int4: 'number',
      int8: 'number',
      float4: 'number',
      float8: 'number',
      numeric: 'number',
      serial: 'number',
      bigserial: 'number',
      // Text
      varchar: 'text',
      text: 'textarea',
      char: 'text',
      bpchar: 'text',
      name: 'text',
      // Boolean
      bool: 'checkbox',
      // Date/Time
      timestamp: 'datetime-local',
      timestamptz: 'datetime-local',
      date: 'date',
      time: 'time',
      timetz: 'time',
      // JSON
      json: 'json',
      jsonb: 'json',
      // UUID
      uuid: 'text',
      // Arrays
      _text: 'textarea',
      _int4: 'text',
      _varchar: 'text',
    };
    return typeMap[udtName] || 'text';
  }

  async getTables(): Promise<string[]> {
    const pool = this.connectionService.getPool();
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_metadb_%'
      ORDER BY table_name
    `);
    return result.rows.map((row) => row.table_name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const pool = this.connectionService.getPool();

    // Get primary key columns
    const pkResult = await pool.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
    `, [tableName]);
    const pkColumns = new Set(pkResult.rows.map((r) => r.column_name));

    // Get all columns
    const result = await pool.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    return result.rows.map((row) => ({
      column_name: row.column_name,
      data_type: row.data_type,
      udt_name: row.udt_name,
      is_nullable: row.is_nullable,
      column_default: row.column_default,
      is_primary_key: pkColumns.has(row.column_name),
      web_type: this.mapToWebType(row.udt_name),
    }));
  }

  async getForeignKeys(): Promise<ForeignKeyInfo[]> {
    const pool = this.connectionService.getPool();
    const result = await pool.query(`
      SELECT
        tc.constraint_name,
        kcu.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_name
    `);
    return result.rows;
  }

  async getFullSchema(): Promise<{
    tables: TableSchema[];
    foreignKeys: ForeignKeyInfo[];
  }> {
    const tableNames = await this.getTables();
    const tables: TableSchema[] = [];

    for (const tableName of tableNames) {
      const columns = await this.getColumns(tableName);
      tables.push({ table_name: tableName, columns });
    }

    const foreignKeys = await this.getForeignKeys();

    return { tables, foreignKeys };
  }
}
