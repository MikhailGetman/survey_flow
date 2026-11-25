const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Survey {
    static async create(userId, { title, description, anonymous, allowChange, questions }) {
        const publicLink = uuidv4().substring(0, 8);
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            
            const [surveyResult] = await connection.execute(
                `INSERT INTO surveys 
                 (user_id, title, description, public_link, anonymous, allow_change) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, title, description, publicLink, anonymous || false, allowChange !== false]
            );
            const surveyId = surveyResult.insertId;

            
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const questionData = {
                    survey_id: surveyId,
                    order_index: i + 1,
                    type: q.type,
                    text: q.text,
                    required: q.required || false,
                    options: q.options ? JSON.stringify(q.options) : null,
                    scale_min: q.scaleMin || null,
                    scale_max: q.scaleMax || null,
                    scale_labels: q.scaleLabels ? JSON.stringify(q.scaleLabels) : null
                };

                await connection.execute(
                    `INSERT INTO questions 
                     (survey_id, order_index, type, text, required, options, scale_min, scale_max, scale_labels)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        questionData.survey_id,
                        questionData.order_index,
                        questionData.type,
                        questionData.text,
                        questionData.required,
                        questionData.options,
                        questionData.scale_min,
                        questionData.scale_max,
                        questionData.scale_labels
                    ]
                );
            }

            await connection.commit();
            return { id: surveyId, publicLink };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByPublicLink(link) {
        const [surveyRows] = await pool.execute(
            'SELECT * FROM surveys WHERE public_link = ? AND is_active = 1',
            [link]
        );
        
        if (surveyRows.length === 0) return null;
        
        const survey = surveyRows[0];
        
        
        const [questionRows] = await pool.execute(
            'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index',
            [survey.id]
        );
        
        survey.questions = questionRows.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null,
            scale_labels: q.scale_labels ? JSON.parse(q.scale_labels) : null
        }));
        
        return survey;
    }

    static async getByUser(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    static async getResults(surveyId) {
        const survey = await this.getById(surveyId);
        if (!survey) return null;

        const [questionRows] = await pool.execute(
            'SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index',
            [surveyId]
        );

        const results = [];
        for (const question of questionRows) {
            let responses;
            
            if (question.type === 'text') {
                [responses] = await pool.execute(
                    'SELECT r.answer, r.created_at, s.respondent_id FROM responses r ' +
                    'JOIN survey_respondents s ON r.respondent_id = s.respondent_id AND r.survey_id = s.survey_id ' +
                    'WHERE r.question_id = ?',
                    [question.id]
                );
            } else {
                [responses] = await pool.execute(
                    'SELECT answer, COUNT(*) as count FROM responses ' +
                    'WHERE question_id = ? GROUP BY answer',
                    [question.id]
                );
            }

            results.push({
                ...question,
                options: question.options ? JSON.parse(question.options) : null,
                responses
            });
        }

        const [totalRows] = await pool.execute(
            'SELECT COUNT(DISTINCT respondent_id) as total FROM survey_respondents WHERE survey_id = ? AND completed = 1',
            [surveyId]
        );

        return {
            survey,
            questions: results,
            totalResponses: totalRows[0].total || 0
        };
    }

    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM surveys WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async updateActivity(id, isActive) {
        await pool.execute(
            'UPDATE surveys SET is_active = ? WHERE id = ?',
            [isActive, id]
        );
    }

    static async delete(id, userId) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            
            await connection.execute(
                'DELETE r FROM responses r JOIN questions q ON r.question_id = q.id WHERE q.survey_id = ?',
                [id]
            );
            
            
            await connection.execute(
                'DELETE FROM survey_respondents WHERE survey_id = ?',
                [id]
            );
            
            
            await connection.execute(
                'DELETE FROM questions WHERE survey_id = ?',
                [id]
            );
            
            
            await connection.execute(
                'DELETE FROM surveys WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Survey;