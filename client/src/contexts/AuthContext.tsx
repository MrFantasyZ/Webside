import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'INIT_FAILURE' };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: !!localStorage.getItem('token'), // Set to true if token exists
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false, user: null };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'INIT_START':
      return { ...state, isLoading: true };
    case 'INIT_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'INIT_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false, user: null };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: 'INIT_START' });
      // Verify token and get user info
      authAPI.getProfile()
        .then(({ user }) => {
          dispatch({ type: 'INIT_SUCCESS', payload: { user, token } });
        })
        .catch((error) => {
          localStorage.removeItem('token');
          dispatch({ type: 'INIT_FAILURE' });
        });
    } else {
      dispatch({ type: 'INIT_FAILURE' });
    }
  }, []);

  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { user, token } = await authAPI.login({ username, password });
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { user, token } = await authAPI.register(data);
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const { user } = await authAPI.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    await authAPI.forgotPassword(email);
  };

  const resetPassword = async (token: string, email: string, newPassword: string) => {
    await authAPI.resetPassword({ token, email, newPassword });
  };

  const isAdmin = state.user?.role === 'admin' || state.user?.role === 'superadmin';
  const isSuperAdmin = state.user?.role === 'superadmin';
  

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    isAdmin,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}