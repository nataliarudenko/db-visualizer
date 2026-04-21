import React, { useState } from 'react';
import useConnectionStore from '../stores/connectionStore';

export default function ConnectionPage() {
  const { connect, loading, error, clearError } = useConnectionStore();
  const [form, setForm] = useState({
    host: 'localhost',
    port: 5432,
    database: '',
    user: 'postgres',
    password: '',
  });

  const handleChange = (e) => {
    clearError();
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'port' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await connect(form);
    } catch {
      // error is in store
    }
  };

  return (
    <div className="connection-page">
      <div className="connection-card">
        <div className="connection-card__logo">
          <div className="connection-card__icon">🗄️</div>
          <h1 className="connection-card__title">Meta-DB</h1>
        </div>
        <p className="connection-card__subtitle">
          Підключіться до бази даних PostgreSQL для візуалізації та управління її схемою
        </p>

        <form onSubmit={handleSubmit} id="connection-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 3 }}>
              <label htmlFor="input-host">Хост</label>
              <input
                id="input-host"
                className="form-input"
                type="text"
                name="host"
                value={form.host}
                onChange={handleChange}
                placeholder="localhost"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="input-port">Порт</label>
              <input
                id="input-port"
                className="form-input"
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                placeholder="5432"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="input-database">База даних</label>
            <input
              id="input-database"
              className="form-input"
              type="text"
              name="database"
              value={form.database}
              onChange={handleChange}
              placeholder="my_database"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="input-user">Користувач</label>
            <input
              id="input-user"
              className="form-input"
              type="text"
              name="user"
              value={form.user}
              onChange={handleChange}
              placeholder="postgres"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="input-password">Пароль</label>
            <input
              id="input-password"
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
            id="btn-connect"
            style={{ marginTop: 24 }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Підключення...
              </>
            ) : (
              <>🔌 Підключитися</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
