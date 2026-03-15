import app from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
  console.log(`Cosmo AI Worker flying at warp speed on port ${PORT}`);
});
