// @ts-nocheck
declare namespace NodeJs {
    interface ProcessEnv {
        REFFERQ_DATABASE_URL: string;
        REFFERQ_JWT_SECRET: string;
        REFFERQ_APP_BASE_PATH: string;
        REFFERQ_API_BASE_PATH: string;
        RESEND_API_KEY: string;
        RESEND_FROM_EMAIL: string;
        NEXT_PUBLIC_APP_URL: string;
        JWT_SECRET: string;
        DATABASE_URL: string;
    }
}

declare var process: {
    env: NodeJs.ProcessEnv;
};
