import { Request, Response } from 'express';
import { pool } from '../app';
import { v4 as uuidv4 } from 'uuid';

function processQuestionSettings(settings: any): any {
    if (!settings) return {};
    if (typeof settings === 'string') {
        try {
            return JSON.parse(settings);
        } catch {
            return {};
        }
    }
    return settings;
}

function processQuestionOptions(options: any[]): any[] {
    if (!Array.isArray(options)) return [];
    return options.map((opt: any) => ({
        id: Number(opt.id),
        question_id: Number(opt.question_id),
        text: opt.text,
        order_index: Number(opt.order_index)
    }));
}


export const surveyController = {
    
    async create(req: Request, res: Response) {
        try {
            const { title, description, isAnonymous, allowRetake, status, questions } = req.body;
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            
            const publicLink = uuidv4();
            const result = await conn.query(
                'INSERT INTO surveys (user_id, title, description, is_anonymous, allow_retake, status, public_link) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, title, description || '', isAnonymous || false, allowRetake || false, status || 'draft', publicLink]
            );
            
            const surveyId = Number(result.insertId);
            
            if (questions && Array.isArray(questions) && questions.length > 0) {
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    
                    const questionResult = await conn.query(
                        'INSERT INTO questions (survey_id, type, title, description, required, order_index, settings) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            surveyId,
                            q.type,
                            q.title,
                            q.description || '',
                            q.required || false,
                            i,
                            JSON.stringify(q.settings || {})
                        ]
                    );
                    
                    const questionId = Number(questionResult.insertId);
                    
                    if (q.type !== 'text') {

                        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                            if (q.options && Array.isArray(q.options)) {
                                for (let j = 0; j < q.options.length; j++) {
                                    const optionText = typeof q.options[j] === 'string' ? q.options[j] : (q.options[j]?.text || q.options[j]);
                                    if (optionText && String(optionText).trim()) {
                                        await conn.query(
                                            'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                            [questionId, String(optionText).trim(), j]
                                        );
                                    }
                                }
                            }
                            
                            
                            if (q.settings?.hasOther) {
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, 'Другое', (q.options?.length || 0)]
                                );
                            }
                        }
                        
                        if (q.type === 'likert_scale') {
                            const min = q.settings?.likertScale?.min || q.likertMin || 1;
                            const max = q.settings?.likertScale?.max || q.likertMax || 5;
                            
                            for (let value = min; value <= max; value++) {
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, String(value), value - min]
                                );
                            }
                        }
                        
                        if (q.type === 'ab_test') {
                            const variants = q.settings?.abTest?.variants || q.abVariants || [];
                            
                            for (let v = 0; v < variants.length; v++) {
                                if (variants[v] && String(variants[v]).trim()) {
                                    await conn.query(
                                        'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                        [questionId, String(variants[v]).trim(), v]
                                    );
                                }
                            }
                            
                            if (variants.length === 0) {
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, 'Вариант A', 0]
                                );
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, 'Вариант B', 1]
                                );
                            }
                        }
                    }
                }
            }
            
            conn.release();
            
            res.status(201).json({
                id: surveyId,
                publicLink: `http:localhost:3000/survey/${surveyId}`,
                message: 'Опрос успешно создан'
            });
            
        } catch (error) {
            console.error('Create survey error:', error);
            res.status(500).json({ error: 'Ошибка создания опроса' });
        }
    },
    
    async getSurveyById(req: Request, res: Response) {
        try {
            const { surveyId } = req.params;
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            const [survey] = await conn.query(
                'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
                [surveyId, userId]
            );
            
            if (!survey) {
                conn.release();
                return res.status(404).json({ error: 'Опрос не найден или нет доступа' });
            }
            
            const questions = await conn.query(
                'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index',
                [surveyId]
            );
            
            const processedQuestions = questions.map((q: any) => ({
                id: Number(q.id),
                survey_id: Number(q.survey_id),
                type: q.type,
                title: q.title,
                description: q.description,
                required: Boolean(q.required),
                order_index: Number(q.order_index),
                settings: processQuestionSettings(q.settings),
                options: []
            }));
            
            for (const question of processedQuestions) {
                if (question.type !== 'text') {
                    const options = await conn.query(
                        'SELECT * FROM question_options WHERE question_id = ? ORDER BY order_index',
                        [question.id]
                    );
                    question.options = processQuestionOptions(options);
                }
            }
            
            conn.release();
            
            res.json({
                id: Number(survey.id),
                user_id: Number(survey.user_id),
                title: survey.title,
                description: survey.description,
                isAnonymous: Boolean(survey.is_anonymous),
                allowRetake: Boolean(survey.allow_retake),
                status: survey.status,
                public_link: survey.public_link,
                created_at: survey.created_at,
                updated_at: survey.updated_at,
                questions: processedQuestions
            });
            
        } catch (error) {
            console.error('Get survey by id error:', error);
            res.status(500).json({ error: 'Ошибка получения опроса' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { surveyId } = req.params;
            const userId = (req as any).userId;
            const { title, description, isAnonymous, allowRetake, status, questions } = req.body;
            
            const conn = await pool.getConnection();
            
            const [existingSurvey] = await conn.query(
                'SELECT id, user_id FROM surveys WHERE id = ?',
                [surveyId]
            );
            
            if (!existingSurvey) {
                conn.release();
                return res.status(404).json({ error: 'Опрос не найден' });
            }
            
            if (Number(existingSurvey.user_id) !== userId) {
                conn.release();
                return res.status(403).json({ error: 'Нет доступа' });
            }
            
            await conn.query(
                `UPDATE surveys SET title = ?, description = ?, is_anonymous = ?, allow_retake = ?, status = ?, updated_at = NOW() WHERE id = ?`,
                [title, description || '', isAnonymous || false, allowRetake || false, status || 'draft', surveyId]
            );
            
            if (questions && Array.isArray(questions) && questions.length > 0) {
                const existingQuestions = await conn.query(
                    'SELECT id FROM questions WHERE survey_id = ?',
                    [surveyId]
                );
                const existingIds = existingQuestions.map((q: any) => Number(q.id));
                const updatedIds: number[] = [];
                
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    let questionId: number;
                    
                    if (q.id && existingIds.includes(Number(q.id))) {
                        questionId = Number(q.id);
                        updatedIds.push(questionId);
                        
                        await conn.query(
                            'UPDATE questions SET type = ?, title = ?, description = ?, required = ?, order_index = ?, settings = ? WHERE id = ? AND survey_id = ?',
                            [q.type, q.title, q.description || '', q.required || false, i, JSON.stringify(q.settings || {}), questionId, surveyId]
                        );
                        
                        await conn.query('DELETE FROM question_options WHERE question_id = ?', [questionId]);
                    } else {
                        const questionResult = await conn.query(
                            'INSERT INTO questions (survey_id, type, title, description, required, order_index, settings) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [surveyId, q.type, q.title, q.description || '', q.required || false, i, JSON.stringify(q.settings || {})]
                        );
                        questionId = Number(questionResult.insertId);
                        updatedIds.push(questionId);
                    }
                    
                    if (q.type !== 'text') {
                        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                            if (q.options && Array.isArray(q.options)) {
                                for (let j = 0; j < q.options.length; j++) {
                                    const optionText = typeof q.options[j] === 'string' ? q.options[j] : (q.options[j]?.text || q.options[j]);
                                    if (optionText && String(optionText).trim()) {
                                        await conn.query(
                                            'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                            [questionId, String(optionText).trim(), j]
                                        );
                                    }
                                }
                            }
                            if (q.settings?.hasOther) {
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, 'Другое', (q.options?.length || 0)]
                                );
                            }
                        }
                        
                        if (q.type === 'likert_scale') {
                            const settings = q.settings || {};
                            const min = settings.likertScale?.min || 1;
                            const max = settings.likertScale?.max || 5;
                            for (let value = min; value <= max; value++) {
                                await conn.query(
                                    'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                    [questionId, String(value), value - min]
                                );
                            }
                        }
                        
                        if (q.type === 'ab_test') {
                            const settings = q.settings || {};
                            const variants = settings.abTest?.variants || ['Вариант A', 'Вариант B'];
                            for (let v = 0; v < variants.length; v++) {
                                if (variants[v] && String(variants[v]).trim()) {
                                    await conn.query(
                                        'INSERT INTO question_options (question_id, text, order_index) VALUES (?, ?, ?)',
                                        [questionId, String(variants[v]).trim(), v]
                                    );
                                }
                            }
                        }
                    }
                }
                
                const idsToDelete = existingIds.filter((id : any) => !updatedIds.includes(id));
                if (idsToDelete.length > 0) {
                    await conn.query(
                        `DELETE FROM questions WHERE id IN (${idsToDelete.map(() => '?').join(',')}) AND survey_id = ?`,
                        [...idsToDelete, surveyId]
                    );
                }
            }
            
            conn.release();
            
            res.json({ id: Number(surveyId), message: 'Опрос успешно обновлен' });
            
        } catch (error) {
            console.error('Update survey error:', error);
            res.status(500).json({ error: 'Ошибка обновления опроса' });
        }
    },
    
    async delete(req: Request, res: Response) {
        try {
            const { surveyId } = req.params;
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            const result = await conn.query(
                'DELETE FROM surveys WHERE id = ? AND user_id = ?',
                [surveyId, userId]
            );
            conn.release();
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Опрос не найден или нет доступа' });
            }
            
            res.json({ message: 'Опрос удален' });
            
        } catch (error) {
            console.error('Delete survey error:', error);
            res.status(500).json({ error: 'Ошибка удаления опроса' });
        }
    },

    
    async getMySurveys(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            const surveys = await conn.query(
                `SELECT s.*, 
                        (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count,
                        (SELECT COUNT(*) FROM questions q WHERE q.survey_id = s.id) as questions_count
                 FROM surveys s 
                 WHERE s.user_id = ? 
                 ORDER BY s.created_at DESC`,
                [userId]
            );
            conn.release();
            
            const processedSurveys = surveys.map((s: any) => ({
                id: Number(s.id),
                user_id: Number(s.user_id),
                title: s.title,
                description: s.description,
                status: s.status,
                is_anonymous: Boolean(s.is_anonymous),
                allow_retake: Boolean(s.allow_retake),
                public_link: s.public_link,
                response_count: Number(s.response_count || 0),
                questions_count: Number(s.questions_count || 0),
                created_at: s.created_at,
                updated_at: s.updated_at
            }));
            
            res.json(processedSurveys);
            
        } catch (error) {
            console.error('Get my surveys error:', error);
            res.status(500).json({ error: 'Ошибка получения опросов' });
        }
    },

    
    async getTakenSurveys(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            
            const conn = await pool.getConnection();
            const takenSurveys = await conn.query(
                `SELECT s.id, s.title, s.description, 
                        r.id as response_id, r.completed_at,
                        u.name as creator_name,
                        (SELECT COUNT(*) FROM questions WHERE survey_id = s.id) as questions_count
                 FROM responses r
                 INNER JOIN surveys s ON s.id = r.survey_id
                 LEFT JOIN users u ON u.id = s.user_id
                 WHERE r.respondent_id = ?
                 ORDER BY r.completed_at DESC`,
                [userId.toString()]
            );
            
            for (const survey of takenSurveys) {
                const [answerCount] = await conn.query(
                    'SELECT COUNT(*) as count FROM response_details WHERE response_id = ?',
                    [survey.response_id]
                );
                survey.answers_count = Number(answerCount.count);
            }
            
            conn.release();
            
            res.json({
                surveys: takenSurveys.map((s: any) => ({
                    id: Number(s.id),
                    title: s.title,
                    description: s.description,
                    response_id: Number(s.response_id),
                    completed_at: s.completed_at,
                    creator_name: s.creator_name,
                    questions_count: Number(s.questions_count),
                    answers_count: Number(s.answers_count)
                })),
                total: takenSurveys.length
            });
            
        } catch (error) {
            console.error('Get taken surveys error:', error);
            res.status(500).json({ error: 'Ошибка получения пройденных опросов' });
        }
    },
};