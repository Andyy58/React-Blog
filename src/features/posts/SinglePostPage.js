import { useSelector } from "react-redux";
import { selectPostById } from "./postsSlice";
import ReactionButtons from "./ReactionButtons";
import TimeAgo from "./TimeAgo";
import PostAuthor from "./PostAuthor";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

const SinglePagePost = () => {
  const { postId } = useParams(); // Gets the postId from the url parameter

  // Note: When there is only 1 expression in an => function, will auto return. If there are brackets, need to write a return
  const post = useSelector((state) => selectPostById(state, Number(postId)));

  if (!post) {
    return (
      <section>
        <h2>Requested post was not found</h2>
      </section>
    );
  }

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
      <p className="postCredit">
        <Link to={`/post/edit/${post.id}`}>Edit Post</Link>
        <PostAuthor userId={post.userId} />
        <TimeAgo timestamp={post.date} />
      </p>
      <ReactionButtons post={post} />
    </article>
  );
};

export default SinglePagePost;
