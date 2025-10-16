module.exports = {
    apps: [{
        name: 'government-news-scraper',
        script: './src/app.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        env_development: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        log_file: './logs/pm2.log',
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        time: true
    }]
};