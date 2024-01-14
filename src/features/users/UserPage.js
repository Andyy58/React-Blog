import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectUserById } from "./usersSlice";
import PostsExcerpt from "../posts/PostsExcerpt";
import { useGetPostsByUserIdQuery } from "../posts/postsSlice";

const UserPage = () => {
  const { userId } = useParams();
  const user = useSelector((state) => selectUserById(state, Number(userId)));

  const {
    data: userPosts,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetPostsByUserIdQuery(userId);

  let content;
  if (isLoading) {
    content = <p>Loading...</p>;
  } else if (isSuccess) {
    const { ids, entities } = userPosts;
    content = ids.map((id) => <PostsExcerpt postId={id} key={id} />);
  } else if (isError) {
    content = <p>{error.error}</p>;
    console.log("Content loading error");
    console.log(error);
  }

  return (
    <section>
      <h2>{user?.name}'s Posts</h2>
      {content}
    </section>
  );
};

export default UserPage;
