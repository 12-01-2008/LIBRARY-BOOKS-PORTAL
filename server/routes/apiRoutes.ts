import { Router } from 'express';
import * as bookController from '../controllers/bookController.ts';
import * as loanController from '../controllers/loanController.ts';
import * as requestController from '../controllers/requestController.ts';
import * as notificationController from '../controllers/notificationController.ts';

import { requireLibrarian } from '../middleware/auth.ts';
import { validateBody, validateQuery } from '../middleware/validate.ts';
import { requestLimiter, viewLimiter } from '../middleware/rateLimit.ts';

import {
  createBookSchema,
  updateBookSchema,
  createRequestSchema,
  issueLoanSchema,
  patchAvailabilitySchema,
  updateNotificationSchema,
  updateRequestSchema,
  queryBooksSchema,
} from '../validators/schemas.ts';

const router = Router();

/* ====================================================================
   PUBLIC STUDENT ROUTES
==================================================================== */

// Search & Catalog
router.get('/books', validateQuery(queryBooksSchema), bookController.getBooks);
router.get('/books/:id', bookController.getBookById);
router.get('/subjects', bookController.getSubjects);

// Ask the Library / Notify Me request (Spam protected & rate limited)
router.post('/books/:id/requests', requestLimiter, validateBody(createRequestSchema), requestController.createStudentRequest);

// Record unavailable-book view (Deduplicated view tracker)
router.post('/books/:id/view', viewLimiter, requestController.recordBookView);


/* ====================================================================
   LIBRARIAN PROTECTED ROUTES
==================================================================== */

// Book CRUD & Inventory
router.post('/books', requireLibrarian, validateBody(createBookSchema), bookController.createBook);
router.put('/books/:id', requireLibrarian, validateBody(updateBookSchema), bookController.updateBook);
router.delete('/books/:id', requireLibrarian, bookController.deleteBook);

// Issue & Return Operations
router.post('/books/:id/issue', requireLibrarian, validateBody(issueLoanSchema), loanController.issueLoan);
router.post('/books/:id/return', requireLibrarian, loanController.returnLoan);
router.patch('/books/:id/availability', requireLibrarian, validateBody(patchAvailabilitySchema), bookController.patchAvailability);

// Dashboard Statistics
router.get('/stats', requireLibrarian, bookController.getStats);

// Notification Feed
router.get('/notifications', requireLibrarian, notificationController.getNotifications);
router.patch('/notifications/:id', requireLibrarian, validateBody(updateNotificationSchema), notificationController.updateNotification);
router.post('/notifications/read-all', requireLibrarian, notificationController.markAllAsRead);

// Student Request Management
router.get('/requests', requireLibrarian, requestController.getRequests);
router.patch('/requests/:id', requireLibrarian, validateBody(updateRequestSchema), requestController.updateRequest);

export default router;
