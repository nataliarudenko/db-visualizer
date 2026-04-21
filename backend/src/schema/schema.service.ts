import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';

@Injectable()
export class SchemaService {
  constructor(private readonly connectionService: ConnectionService) {}

  async createForeignKey(
    sourceTable: string,
    sourceColumn: string,
    targetTable: string,
    targetColumn: string,
  ): Promise<{ success: boolean; constraint_name: string }> {
    const pool = this.connectionService.getPool();

    const safeSource = sourceTable.replace(/"/g, '""');
    const safeSourceCol = sourceColumn.replace(/"/g, '""');
    const safeTarget = targetTable.replace(/"/g, '""');
    const safeTargetCol = targetColumn.replace(/"/g, '""');

    // Create a safe constraint name by replacing all non-alphanumeric (including cyrillic) with underscoress
    // Since JS regex \W matches cyrillic, we just use a hash or base36 of timestamp to ensure valid ANSI ascii constraint name
    const constraintName = `fk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await pool.query(`
      ALTER TABLE "${safeSource}"
      ADD CONSTRAINT "${constraintName}"
      FOREIGN KEY ("${safeSourceCol}")
      REFERENCES "${safeTarget}" ("${safeTargetCol}")
    `);

    return { success: true, constraint_name: constraintName };
  }

  async createColumnAndForeignKey(
    sourceTable: string,
    sourceColumn: string,
    targetTable: string,
  ): Promise<{ success: boolean; newColumnName: string; constraint_name: string }> {
    const pool = this.connectionService.getPool();

    const safeSource = sourceTable.replace(/"/g, '""');
    const safeTarget = targetTable.replace(/"/g, '""');
    const safeSourceCol = sourceColumn.replace(/"/g, '""');

    // We add the column to the Target table. 
    // The name of the new column depends on the Source table name.
    const baseColName = sourceTable.replace(/[^\w\s\u0400-\u04FF]/g, '').toLowerCase() + '_id';
    const safeNewCol = baseColName.replace(/"/g, '""');

    // 1. Add column to Target table
    await pool.query(`
      ALTER TABLE "${safeTarget}" 
      ADD COLUMN "${safeNewCol}" INTEGER
    `);

    // 2. Add constraint: Target(newCol) references Source(sourceCol)
    const constraintName = `fk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    
    await pool.query(`
      ALTER TABLE "${safeTarget}"
      ADD CONSTRAINT "${constraintName}"
      FOREIGN KEY ("${safeNewCol}")
      REFERENCES "${safeSource}" ("${safeSourceCol}")
    `);

    return { success: true, newColumnName: baseColName, constraint_name: constraintName };
  }

  async deleteForeignKey(
    constraintName: string,
    tableName: string,
  ): Promise<{ success: boolean }> {
    const pool = this.connectionService.getPool();

    const safeTable = tableName.replace(/"/g, '""');
    const safeConstraint = constraintName.replace(/"/g, '""');

    await pool.query(`
      ALTER TABLE "${safeTable}"
      DROP CONSTRAINT "${safeConstraint}"
    `);

    return { success: true };
  }
}
