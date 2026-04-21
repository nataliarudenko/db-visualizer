import { Module } from '@nestjs/common';
import { ConnectionModule } from './connection/connection.module';
import { IntrospectionModule } from './introspection/introspection.module';
import { DataModule } from './data/data.module';
import { SchemaModule } from './schema/schema.module';
import { LayoutModule } from './layout/layout.module';

@Module({
  imports: [
    ConnectionModule,
    IntrospectionModule,
    DataModule,
    SchemaModule,
    LayoutModule,
  ],
})
export class AppModule {}
