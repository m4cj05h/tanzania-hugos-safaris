import {createContext,useContext} from 'react';
// Shared by every admin page: the unpublished draft, the live content and the enquiry inbox.
export const AdminContext=createContext(null);
export const useAdmin=()=>useContext(AdminContext);
