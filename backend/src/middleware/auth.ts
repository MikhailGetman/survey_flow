

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
        (req as any).userId = decoded.userId;
        (req as any).email = decoded.email;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Недействительный токен' });
    }
}


export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
            (req as any).userId = decoded.userId;
            (req as any).email = decoded.email;
        } catch (error) {
            
            console.log('Invalid token in optional auth');
        }
    }
    
    next();
}
#окак
