import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class LayoutService {
  constructor(private readonly connectionService: ConnectionService) {}

  private async ensureLayoutTable(): Promise<void> {
    const pool = this.connectionService.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "_metadb_layout" (
        id SERIAL PRIMARY KEY,
        layout_data JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure at least one row exists
    const result = await pool.query('SELECT COUNT(*) as cnt FROM "_metadb_layout"');
    if (parseInt(result.rows[0].cnt, 10) === 0) {
      await pool.query(`INSERT INTO "_metadb_layout" (layout_data) VALUES ('{}')`);
    }
  }

  async getLayout(): Promise<Record<string, { x: number; y: number }>> {
    const pool = this.connectionService.getPool();
    await this.ensureLayoutTable();

    const result = await pool.query(
      'SELECT layout_data FROM "_metadb_layout" ORDER BY id LIMIT 1',
    );
    return result.rows[0]?.layout_data || {};
  }

  async saveLayout(
    layoutData: Record<string, { x: number; y: number }>,
  ): Promise<{ success: boolean }> {
    const pool = this.connectionService.getPool();
    await this.ensureLayoutTable();

    await pool.query(
      `UPDATE "_metadb_layout" SET layout_data = $1, updated_at = NOW() WHERE id = (SELECT id FROM "_metadb_layout" ORDER BY id LIMIT 1)`,
      [JSON.stringify(layoutData)],
    );

    return { success: true };
  }
}
