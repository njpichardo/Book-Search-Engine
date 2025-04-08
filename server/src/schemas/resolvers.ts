import { AuthenticationError } from 'apollo-server-express';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import type { BookDocument } from '../models/Book.js';

interface BookInput {
  bookId: string;
  authors: string[];
  description: string;
  image: string;
  link: string;
  title: string;
}

const resolvers = {
  Query: {
    // Get the logged in user
    me: async (_parent: unknown, _args: unknown, context: { user?: { _id: unknown } }) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    // Login user
    login: async (_parent: unknown, { email, password }: { email: string; password: string }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user.username, user.email, user._id);

      return { token, user };
    },

    // Create a new user
    addUser: async (_parent: unknown, args: { username: string; email: string; password: string }) => {
      const user = await User.create(args);
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    // Save a book to a user's `savedBooks`
    saveBook: async (_parent: unknown, { bookData }: { bookData: BookInput }, context: { user?: { _id: unknown } }) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    // Remove a book from `savedBooks`
    removeBook: async (_parent: unknown, { bookId }: { bookId: string }, context: { user?: { _id: unknown } }) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

export default resolvers;