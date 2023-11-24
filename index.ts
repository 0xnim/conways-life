const M = 50, N = 50;
let grid = [
  // Initialize your grid here
];

for (let i = 0; i < M; i++) {
  let row = [];
  for (let j = 0; j < N; j++) {
    // Generate a random value (0 or 1)
    row.push(Math.round(Math.random()));
  }
  grid.push(row);
}

let isStop = true;
let interval = null;

const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return undefined;
    }
    return new Response("Hello world!");
  },
  websocket: {
    open(ws) {
      ws.send(JSON.stringify(grid)); // Send the initial grid state
    },
    message(ws, message) {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === "nextIteration") {
        // Compute the next generation
        grid = nextGeneration(grid, M, N);
        // Send the updated grid state to all connected clients
        ws.send(JSON.stringify(grid));
      } else if (parsedMessage.type === "startStop") {
        // Toggle between starting and stopping the loop
        isStop = !isStop;

        if (isStop) {
          // Stop the interval if it's running
          clearInterval(interval);
          interval = null; // Reset interval variable
        } else {
          // Start the interval if it's not already running
          if (interval === null) {
            interval = setInterval(() => {
              grid = nextGeneration(grid, M, N);
              ws.send(JSON.stringify(grid));
            }, 50);
          }
        }
      }
    },
  },
});

function nextGeneration(grid, M, N) {
  let future = new Array(M);
  for(let i = 0; i < M; i++){
      future[i] = new Array(N).fill(0);
  }

  // Loop through every cell
  for(let l=0; l<M; l++){
      for(let m=0; m<N; m++){
          let aliveNeighbours = 0;
          for(let i = -1; i < 2; i++) {
              for(let j = -1; j < 2; j++) {
                  if ((l + i >= 0 && l + i < M) && (m + j >= 0 && m + j < N)) {
                      aliveNeighbours += grid[l + i][m + j];
                  }
              }
          }
          aliveNeighbours -= grid[l][m];

          if ((grid[l][m] == 1) && (aliveNeighbours < 2)) {
              future[l][m] = 0;
          }
          else if ((grid[l][m] == 1) && (aliveNeighbours > 3)) {
              future[l][m] = 0;
          }
          else if ((grid[l][m] == 0) && (aliveNeighbours == 3)) {
              future[l][m] = 1;
          }
          else {
              future[l][m] = grid[l][m];
          }
      }
  }
  return future;
}

console.log(`Listening on ${server.hostname}:${server.port}`);
