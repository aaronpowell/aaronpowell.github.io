import { loadPosts } from "../postLoader";
import { Post, QueryResolvers } from "./generated";

export const Query: QueryResolvers = {
    async post(_, { id }) {
        const posts = await loadPosts();

        return posts.find(p => p.id === id);
    },

    async postsByTag(_, { tag }) {
        const posts = await loadPosts();

        return posts.filter(post => post.tags.some(t => t === tag));
    }
};
