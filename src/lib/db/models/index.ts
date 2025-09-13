// Export all models
export { default as User } from './User';
export { default as LoanApplication } from './LoanApplication';
export { default as ChatMessage } from './ChatMessage';
export { default as SupportTicket } from './SupportTicket';
export { default as DSAActivity } from './DSAActivity';
export { default as SystemLog } from './SystemLog';

// Export interfaces
export type { IUser } from './User';
export type { ILoanApplication, IPersonalDetails, ILoanDetails, IDocument, IStatusHistory } from './LoanApplication';
export type { IChatMessage } from './ChatMessage';
export type { ISupportTicket, ITicketResponse } from './SupportTicket';
export type { IDSAActivity } from './DSAActivity';
export type { ISystemLog } from './SystemLog';
