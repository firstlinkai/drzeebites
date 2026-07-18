import * as migration_20260718_091003_initial from './20260718_091003_initial';

export const migrations = [
  {
    up: migration_20260718_091003_initial.up,
    down: migration_20260718_091003_initial.down,
    name: '20260718_091003_initial'
  },
];
