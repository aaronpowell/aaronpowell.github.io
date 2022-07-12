import { readFile } from "fs/promises";
import { join } from "path";
import { Post } from "./graphql/generated";

let posts: Post[] | null = null;

export async function loadPosts() {
    if (!posts) {
        const json = await readFile(
            join(__dirname, "..", "index.json"),
            "utf-8"
        );

        posts = JSON.parse(json).posts;
    }

    return posts;
}
