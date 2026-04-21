import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { IntrospectionService } from './introspection.service';

@Controller('introspection')
export class IntrospectionController {
  constructor(private readonly introspectionService: IntrospectionService) {}

  @Get('tables')
  async getTables() {
    try {
      return await this.introspectionService.getTables();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('columns/:table')
  async getColumns(@Param('table') table: string) {
    try {
      return await this.introspectionService.getColumns(table);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('foreign-keys')
  async getForeignKeys() {
    try {
      return await this.introspectionService.getForeignKeys();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('full-schema')
  async getFullSchema() {
    try {
      return await this.introspectionService.getFullSchema();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
