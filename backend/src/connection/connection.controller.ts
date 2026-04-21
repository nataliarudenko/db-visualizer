import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Controller('connection')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post('connect')
  async connect(
    @Body() body: { host: string; port: number; database: string; user: string; password: string },
  ) {
    const { host, port, database, user, password } = body;

    if (!host || !database || !user) {
      throw new HttpException('Host, database, and user are required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.connectionService.connect({
      host,
      port: port || 5432,
      database,
      user,
      password: password || '',
    });

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  @Post('disconnect')
  async disconnect() {
    return this.connectionService.disconnect();
  }

  @Get('status')
  getStatus() {
    return this.connectionService.getStatus();
  }
}
