import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { IntrospectionModule } from '../introspection/introspection.module';

@Module({
  imports: [IntrospectionModule],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
