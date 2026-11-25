
export interface Survey {
    id: number;
    title: string;
    description: string;
    isAnonymous: boolean;
    allowRetake: boolean;
    publicLink: string;
    questions: Question[];
}

export interface Question {
    id?: number;
    type: 'single_choice' | 'multiple_choice' | 'text' | 'likert_scale' | 'ab_test';
    title: string;
    description?: string;
    required: boolean;
    orderIndex: number;
    options?: string[];
    settings?: QuestionSettings;
}

export interface QuestionSettings {
    likertScale?: {
        min: number;
        max: number;
        labels: string[];
    };
    abTest?: {
        variants: string[];
    };
}

export interface SurveyResults {
    questionId: number;
    type: string;
    data: any[];
}