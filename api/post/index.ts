import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loadPosts } from "../postLoader";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    const id = req.params.id;

    const posts = await loadPosts();

    if (!id) {
        context.res = {
            body: posts
        };
        return;
    }

    const post = posts.find(p => p.id === id);

    if (!post) {
        context.res = {
            status: 404
        };
    } else {
        context.res = {
            body: post
        };
    }
};

export default httpTrigger;
