export interface Application {
  id: number
  jobTitle: string
  companyName: string | null
  status: string
  jobUrl: string | null
  notes: string | null
  appliedDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationRequest {
  jobTitle: string
  companyName?: string
  status: string
  jobUrl?: string
  notes?: string
  appliedDate?: string
}

export interface AuthResponse {
  token: string
  name: string
  email: string
}

export interface Reminder {
  id: number
  message: string
  remindAt: string
  isSent: boolean
  application: {
    id: number
    jobTitle: string
  }
}

export interface CoverLetterResponse {
  coverLetter: string
}