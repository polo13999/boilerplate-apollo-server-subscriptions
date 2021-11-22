declare namespace Express {
    export interface Request {
        tenant?: string
        session: any
    }

}