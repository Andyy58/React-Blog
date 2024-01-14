import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => "/posts",
      transformResponse: (responseData) => {
        // Make sure each post we get has a date and reactions
        const loadedPosts = responseData.map((post) => {
          if (!post?.date) post.date = new Date("2000-01-01").toISOString();
          if (!post?.reactions)
            post.reactions = {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            };
          return post;
        });
        // Set the initial state to the loaded posts
        return postsAdapter.setAll(initialState, loadedPosts);
      },
      providesTags: (results, error, arg) => [
        // If the post tag with id="LIST" is invalidated, it will refetch all posts
        { type: "Post", id: "LIST" },
        // If the post tag with a specific id is invalidated, it will refetch the provider for that specific post (?)
        ...results.ids.map((id) => ({ type: "Post", id })),
      ],
    }),
    getPostsByUserId: builder.query({
      query: (id) => `/posts/?userId=${id}`,
      transformResponse: (responseData) => {
        // Make sure each post we get has a date and reactions
        const loadedPosts = responseData.map((post) => {
          if (!post?.date) post.date = new Date("2000-01-01").toISOString();
          if (!post?.reactions)
            post.reactions = {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            };
          return post;
        });
        // Set the initial state to the loaded posts
        return postsAdapter.setAll(initialState, loadedPosts);
      },
      providesTags: (result, error, arg) => {
        return [...result.ids.map((id) => ({ type: "Post", id }))];
      },
    }),
    addNewPost: builder.mutation({
      query: (initialPost) => ({
        url: "/posts",
        method: "POST",
        body: {
          ...initialPost,
          userId: Number(initialPost.userId),
          date: new Date().toISOString(),
          reactions: { thumbsUp: 0, wow: 0, heart: 0, rocket: 0, cofee: 0 },
        },
      }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
    updatePost: builder.mutation({
      query: (initialPost) => ({
        url: `/posts/${initialPost.id}`,
        method: "PUT",
        body: {
          ...initialPost,
          date: new Date().toISOString(),
        },
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
    }),
    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}`,
        method: "DELETE",
        body: {
          id,
        },
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
    }),
    addReaction: builder.mutation({
      query: ({ postId, reactions }) => ({
        url: `posts/${postId}`,
        method: "PATCH",
        // In a real app, we'd need to base this on userId somehow so that a user can't do the same reaction more than once
        body: { reactions },
      }),
      async onQueryStarted(
        { postId, reactions },
        { dispatch, queryFulfilled } // Dispatch is used to dispatch the `updateQueryData` action to update cached data for getPosts
      ) {
        // `udpateQueryData` requires the endpoint name and cache key arguments so it knows which piece of cache state to update
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getPosts",
            undefined,
            (draft) => {
              // Draft is the current cached data from getPosts
              // The `draft` is Immer-wrapped and can be "mutated" like in createSlice
              const post = draft.entities[postId]; // Picks out the cached post with matching id
              if (post) post.reactions = reactions; // If the post exists, update the reactions in the cache
            }
          )
        );
        try {
          await queryFulfilled; // Pause execution until we get a response from the server
        } catch (err) {
          patchResult.undo(); // If the request fails, the reaction was unable to update and we undo the 'optimistic update'
          console.log(err);
        }
        // Since we don't invalidate any tags, we don't need to refetch and re-render the whole page
      },
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostsByUserIdQuery,
  useAddNewPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAddReactionMutation,
} = extendedApiSlice;

// returns the query result object
export const selectPostsResult = extendedApiSlice.endpoints.getPosts.select();

// Creates memoized selector
const selectPostsData = createSelector(
  selectPostsResult,
  (postsResult) => postsResult.data // normalized state object with ids & entities
);

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors(
  (state) => selectPostsData(state) ?? initialState
);
