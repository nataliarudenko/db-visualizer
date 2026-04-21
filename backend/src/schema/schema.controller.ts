import { Controller, Post, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SchemaService } from './schema.service';

@Controller('schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post('foreign-key')
  async createForeignKey(
    @Body()
    body: {
      sourceTable: string;
      sourceColumn: string;
      targetTable: string;
      targetColumn: string;
    },
  ) {
    try {
      return await this.schemaService.createForeignKey(
        body.sourceTable,
        body.sourceColumn,
        body.targetTable,
        body.targetColumn,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('column-and-fk')
  async createColumnAndForeignKey(
    @Body()
    body: {
      sourceTable: string;
      sourceColumn: string;
      targetTable: string;
    },
  ) {
    try {
      return await this.schemaService.createColumnAndForeignKey(
        body.sourceTable,
        body.sourceColumn,
        body.targetTable,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('foreign-key/:tableName/:constraintName')
  async deleteForeignKey(
    @Param('tableName') tableName: string,
    @Param('constraintName') constraintName: string,
  ) {
    try {
      return await this.schemaService.deleteForeignKey(
        constraintName,
        tableName,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
