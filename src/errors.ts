export const noData = () =>
  new Response(
    JSON.stringify({
      error: "No data available",
    }),
    { status: 404 }
  );
