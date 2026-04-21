import React, { useState } from 'react';
import { getInputType } from '../utils/typeMapper';
import useDataStore from '../stores/dataStore';
import SearchableSelect from './SearchableSelect';

export default function AutoForm({ tableName, columns, foreignKeys, onSuccess, initialData = null, isEdit = false }) {
  const { addRow, editRow } = useDataStore();
  const [formData, setFormData] = useState(initialData || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // When initialData comes in, update the state
  React.useEffect(() => {
    setFormData(initialData || {});
    setError(null);
  }, [initialData, isEdit]);

  // Build FK lookup map: sourceColumn -> targetTable
  const fkMap = {};
  foreignKeys.forEach((fk) => {
    if (fk.source_table === tableName) {
      fkMap[fk.source_column] = {
        targetTable: fk.target_table,
        targetColumn: fk.target_column,
      };
    }
  });

  // Filter out auto-generated columns (serial PKs) in ADD mode
  const editableColumns = columns.filter((col) => {
    if (!isEdit && col.is_primary_key && col.column_default?.startsWith('nextval')) return false;
    return true;
  });

  const handleChange = (colName, value) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let success = false;
      if (isEdit) {
        const pkColumn = columns.find((c) => c.is_primary_key);
        const pkName = pkColumn ? pkColumn.column_name : columns[0]?.column_name;
        const payload = { ...formData };
        delete payload[pkName];
        success = await editRow(tableName, formData[pkName], payload);
      } else {
        success = await addRow(tableName, formData);
      }

      if (success) {
        if (!isEdit) setFormData({});
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auto-form" onSubmit={handleSubmit} id="auto-form">
      {editableColumns.map((col) => {
        const inputType = getInputType(col.udt_name);
        const fk = fkMap[col.column_name];
        const isRequired = col.is_nullable === 'NO' && !col.column_default;
        const disabled = isEdit && col.is_primary_key;

        return (
          <div key={col.column_name} className="auto-form__field">
            <label className="auto-form__label">
              {col.column_name}
              {col.is_primary_key && (
                <span className="auto-form__label-badge auto-form__label-badge--pk">PK</span>
              )}
              {fk && (
                <span className="auto-form__label-badge auto-form__label-badge--fk">
                  FK → {fk.targetTable}
                </span>
              )}
              {isRequired && !disabled && (
                <span className="auto-form__label-badge auto-form__label-badge--required">обов.</span>
              )}
            </label>

            {fk ? (
              <SearchableSelect
                targetTable={fk.targetTable}
                value={formData[col.column_name] || ''}
                onChange={(val) => handleChange(col.column_name, val)}
              />
            ) : inputType === 'textarea' || inputType === 'json' ? (
              <textarea
                className="form-input"
                value={formData[col.column_name] || ''}
                onChange={(e) => handleChange(col.column_name, e.target.value)}
                placeholder={inputType === 'json' ? '{"ключ": "значення"}' : `Введіть ${col.column_name}`}
                required={isRequired && !disabled}
                disabled={disabled}
                rows={3}
              />
            ) : inputType === 'checkbox' ? (
              <input
                type="checkbox"
                className="form-input"
                checked={!!formData[col.column_name]}
                onChange={(e) => handleChange(col.column_name, e.target.checked)}
                disabled={disabled}
              />
            ) : (
              <input
                type={inputType}
                className="form-input"
                value={formData[col.column_name] || ''}
                onChange={(e) => handleChange(col.column_name, e.target.value)}
                placeholder={`Введіть ${col.column_name}`}
                required={isRequired && !disabled}
                disabled={disabled}
              />
            )}
          </div>
        );
      })}

      {error && <div className="error-message">{error}</div>}

      <div className="auto-form__actions">
        <button type="button" className="btn btn--secondary" onClick={() => {
          setFormData(initialData || {});
          if (!isEdit) onSuccess?.();
        }}>
          {isEdit ? 'Скинути' : 'Очистити'}
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting} id="btn-submit-form">
          {submitting ? <span className="spinner" /> : (isEdit ? '💾' : '➕')} {isEdit ? 'Зберегти зміни' : 'Додати запис'}
        </button>
      </div>
    </form>
  );
}
