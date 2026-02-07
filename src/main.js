import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@app/App';
import { AppProviders } from '@app/providers';
import { bootstrapApp } from '@app/bootstrap';
import './app/styles.css';
bootstrapApp();
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(AppProviders, { children: _jsx(App, {}) }) }));
