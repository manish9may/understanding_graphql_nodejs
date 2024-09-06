const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validator = require("validator");
module.exports = {
  hello() {
    return { text: "hello world", views: 12345 };
  },
  createUser: async function ({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-mail is invalid" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password is invalid" });
    }

    if (errors.length > 0) {
      const err = new Error("Invalid Input");
      err.data = errors;
      err.code = 422;
      throw err;
    }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const err = new Error("User exist alreday");
      throw err;
    }
    const hashPwd = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashPwd,
    });
    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error("User not found.");
      err.code = 401;
      throw err;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error("Password Incorrect");
      err.code = 401;
      throw err;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "somesupersecret",
      { expiresIn: "1h" }
    );

    return { token: token, userId: user._id.toString() };
  },
  createPost: async function ({ postInputData }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }
    const user = await User.findById(req.userId);

    if (!user) {
      const err = new Error("Invaild User!");
      err.code = 401;
      throw err;
    }
    const post = new Post({
      title: postInputData.title,
      content: postInputData.content,
      imageUrl: postInputData.imageUrl,
      creator: user,
    });

    const createdPost = await post.save();
    user.posts.push(createdPost._doc);
    await user.save();
    const result = {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
    return result;
  },
  posts: async function ({ page, perPage }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }

    const totalPosts = await Post.find().countDocuments();

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return {
      posts: posts.map((p) => ({
        ...p._doc,
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      totalPosts: totalPosts,
    };
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }
    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const err = new Error("No Post found!");
      err.code = 404;
      throw err;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const err = new Error("No Post found!");
      err.code = 404;
      throw err;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const err = new Error("Not Authentrized!");
      err.code = 403;
      throw err;
    }

    post.title = postInput.title;
    post.content = postInput.content;
    post.imageUrl = postInput.imageUrl;

    const updatedPost = await post.save();

    const result = {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
    return result;
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }

    const post = await Post.findById(id);
    if (!post) {
      const err = new Error("No Post found!");
      err.code = 404;
      throw err;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const err = new Error("Not Authentrized!");
      err.code = 403;
      throw err;
    }
    await Post.findByIdAndDelete(id);

    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
  user: async function ({}, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error("No user found!");
      err.code = 404;
      throw err;
    }

    return { ...user._doc, _id: user._id.toString() };
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticaed!");
      err.code = 401;
      throw err;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error("No user found!");
      err.code = 404;
      throw err;
    }
    user.status = status;
    await user.save();

    return { ...user._doc, _id: user._id.toString() };
  },
};
