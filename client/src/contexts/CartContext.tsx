import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Video {
  _id: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  category: string;
}

interface CartItem {
  videoId: Video;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
  isLoading: boolean;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: { items: CartItem[]; total: number; count: number } }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
  count: 0,
  isLoading: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        count: action.payload.count,
        isLoading: false,
      };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + action.payload.videoId.price,
        count: state.count + 1,
      };
    case 'REMOVE_ITEM':
      const itemToRemove = state.items.find(item => item.videoId._id === action.payload);
      return {
        ...state,
        items: state.items.filter(item => item.videoId._id !== action.payload),
        total: state.total - (itemToRemove?.videoId.price || 0),
        count: state.count - 1,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        count: 0,
      };
    default:
      return state;
  }
}

interface CartContextType extends CartState {
  addToCart: (videoId: string) => Promise<void>;
  removeFromCart: (videoId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, token } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated || !token) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { cart } = await cartAPI.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, token]);

  const addToCart = async (videoId: string) => {
    try {
      await cartAPI.addToCart(videoId);
      await refreshCart();
      toast.success('已添加到购物车');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '添加到购物车失败');
      throw error;
    }
  };

  const removeFromCart = async (videoId: string) => {
    try {
      await cartAPI.removeFromCart(videoId);
      dispatch({ type: 'REMOVE_ITEM', payload: videoId });
      toast.success('已从购物车中移除');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '移除失败');
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.success('购物车已清空');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '清空购物车失败');
      throw error;
    }
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}