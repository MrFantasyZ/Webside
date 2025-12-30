import { Request, Response, NextFunction } from 'express';

interface Error {
  message: string;
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  name?: string;
  code?: number;
  path?: string;
  value?: any;
  errors?: any;
  stack?: string;
}

const handleCastErrorDB = (err: Error) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return {
    message,
    statusCode: 400,
    isOperational: true
  };
};

const handleDuplicateFieldsDB = (err: Error) => {
  const duplicateFields = Object.keys(err.errors || {}).join(', ');
  const message = `Duplicate field value${duplicateFields ? `: ${duplicateFields}` : ''}. Please use another value!`;
  return {
    message,
    statusCode: 400,
    isOperational: true
  };
};

const handleValidationErrorDB = (err: Error) => {
  const errors = Object.values(err.errors || {}).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return {
    message,
    statusCode: 400,
    isOperational: true
  };
};

const handleJWTError = () => ({
  message: 'Invalid token. Please log in again!',
  statusCode: 401,
  isOperational: true
});

const handleJWTExpiredError = () => ({
  message: 'Your token has expired! Please log in again.',
  statusCode: 401,
  isOperational: true
});

const sendErrorDev = (err: Error, res: Response) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err: Error, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};