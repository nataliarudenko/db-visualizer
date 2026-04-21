/**
 * Maps PostgreSQL UDT types to web input types
 */
export const pgTypeToInputType = {
  // Numeric
  int2: 'number',
  int4: 'number',
  int8: 'number',
  float4: 'number',
  float8: 'number',
  numeric: 'number',
  serial: 'number',
  bigserial: 'number',
  // Text
  varchar: 'text',
  text: 'textarea',
  char: 'text',
  bpchar: 'text',
  name: 'text',
  // Boolean
  bool: 'checkbox',
  // Date/Time
  timestamp: 'datetime-local',
  timestamptz: 'datetime-local',
  date: 'date',
  time: 'time',
  timetz: 'time',
  // JSON
  json: 'json',
  jsonb: 'json',
  // UUID
  uuid: 'text',
};

/**
 * Get the appropriate HTML input type for a PostgreSQL column
 */
export function getInputType(udtName) {
  return pgTypeToInputType[udtName] || 'text';
}

/**
 * Format a column type for display
 */
export function formatType(dataType) {
  const display = {
    'character varying': 'varchar',
    'integer': 'int',
    'bigint': 'bigint',
    'boolean': 'bool',
    'timestamp without time zone': 'timestamp',
    'timestamp with time zone': 'timestamptz',
    'double precision': 'float8',
    'real': 'float4',
    'text': 'text',
    'jsonb': 'jsonb',
    'json': 'json',
    'uuid': 'uuid',
    'date': 'date',
    'time without time zone': 'time',
  };
  return display[dataType] || dataType;
}

/**
 * Parse a value to the correct JavaScript type based on PostgreSQL type
 */
export function parseValue(value, udtName) {
  if (value === '' || value === null || value === undefined) return null;

  switch (udtName) {
    case 'int2':
    case 'int4':
    case 'int8':
    case 'serial':
    case 'bigserial':
      return parseInt(value, 10);
    case 'float4':
    case 'float8':
    case 'numeric':
      return parseFloat(value);
    case 'bool':
      return Boolean(value);
    case 'json':
    case 'jsonb':
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    default:
      return value;
  }
}
