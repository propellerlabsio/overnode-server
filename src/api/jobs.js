import { knex } from '../knex';

const peers = {
  find: ({ onlyJobsInError }) => {
    let query = knex('job').select();
    if (onlyJobsInError) {
      query = query.whereNotNull('error_message');
    }
    return query;
  },
};

export default peers;
