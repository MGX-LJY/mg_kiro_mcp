/**
 * 中间件汇总
 * 统一管理所有Express中间件配置
 */

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import express from 'express';

/**
 * 配置安全中间件
 * @param {Object} app - Express应用实例
 */
export function setupSecurity(app) {
    app.use(helmet());
    app.use(compression());
}

/**
 * 配置CORS中间件
 * @param {Object} app - Express应用实例
 * @param {Object} config - CORS配置
 */
export function setupCORS(app, config = {}) {
    if (config.enabled !== false) {
        app.use(cors({
            origin: config.origins || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-MCP-Version']
        }));
    }
}

/**
 * 配置请求解析中间件
 * @param {Object} app - Express应用实例
 */
export function setupParsers(app) {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

/**
 * 配置速率限制中间件
 * @param {Object} app - Express应用实例
 * @param {Object} config - 速率限制配置
 */
export function setupRateLimit(app, config = {}) {
    const limiter = rateLimit({
        windowMs: config.windowMs || 60000, // 1分钟
        max: config.max || 100, // 最大请求数
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
}

/**
 * 配置日志中间件
 * @param {Object} app - Express应用实例
 */
export function setupLogging(app) {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

/**
 * 配置错误处理中间件
 * @param {Object} app - Express应用实例
 */
export function setupErrorHandling(app) {
    // 404处理
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
            method: req.method,
            path: req.originalUrl
        });
    });

    // 全局错误处理
    app.use((error, req, res, next) => {
        console.error('Express error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    });
}

/**
 * 应用所有中间件
 * @param {Object} app - Express应用实例
 * @param {Object} config - 配置对象
 */
export function applyMiddleware(app, config = {}) {
    setupSecurity(app);
    setupCORS(app, config.cors);
    setupParsers(app);
    setupRateLimit(app, config.rateLimit);
    setupLogging(app);
}

export default {
    setupSecurity,
    setupCORS,
    setupParsers,
    setupRateLimit,
    setupLogging,
    setupErrorHandling,
    applyMiddleware
};