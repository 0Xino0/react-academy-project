export interface Term {
    id: number;
    year: number;
    season: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TermFormData {
    year: number;
    season: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export interface TermsResponse {
    status: boolean;
    message: string;
    terms: Term[];
}

export interface TermResponse {
    status: boolean;
    message: string;
    term: Term;
}

export interface DeleteTermResponse {
    status: boolean;
    message: string;
}

