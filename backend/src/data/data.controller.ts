import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get(':table')
  async getRows(
    @Param('table') table: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search?: string,
  ) {
    try {
      return await this.dataService.getRows(
        table,
        parseInt(page, 10) || 1,
        parseInt(limit, 10) || 50,
        search,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':table')
  async createRow(@Param('table') table: string, @Body() body: any) {
    try {
      return await this.dataService.createRow(table, body);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':table/:id')
  async updateRow(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    try {
      return await this.dataService.updateRow(table, id, body);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':table/:id')
  async deleteRow(@Param('table') table: string, @Param('id') id: string) {
    try {
      return await this.dataService.deleteRow(table, id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':table/lookup')
  async lookup(
    @Param('table') table: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return await this.dataService.lookup(
        table,
        search,
        parseInt(limit, 10) || 30,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
