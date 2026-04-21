import { Module } from '@nestjs/common';
import { IntrospectionService } from './introspection.service';
import { IntrospectionController } from './introspection.controller';

@Module({
  controllers: [IntrospectionController],
  providers: [IntrospectionService],
  exports: [IntrospectionService],
})
export class IntrospectionModule {}
