import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ConnectionService {
  private pool: Pool | null = null;
  private connectionConfig: any = null;

  async connect(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Close existing connection if any
      if (this.pool) {
        await this.pool.end();
      }

      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.connectionConfig = config;
      return { success: true, message: `Connected to ${config.database}@${config.host}:${config.port}` };
    } catch (error) {
      this.pool = null;
      this.connectionConfig = null;
      return { success: false, message: error.message };
    }
  }

  async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.connectionConfig = null;
      }
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getStatus(): { connected: boolean; config: any } {
    return {
      connected: !!this.pool,
      config: this.connectionConfig
        ? {
            host: this.connectionConfig.host,
            port: this.connectionConfig.port,
            database: this.connectionConfig.database,
            user: this.connectionConfig.user,
          }
        : null,
    };
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Not connected to any database. Please connect first.');
    }
    return this.pool;
  }

  isConnected(): boolean {
    return !!this.pool;
  }
}
