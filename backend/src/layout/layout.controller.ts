import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { LayoutService } from './layout.service';

@Controller('layout')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get()
  async getLayout() {
    try {
      return await this.layoutService.getLayout();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async saveLayout(@Body() body: Record<string, { x: number; y: number }>) {
    try {
      return await this.layoutService.saveLayout(body);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
