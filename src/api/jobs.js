import { knex } from '../knex';

const jobs = {
  find: ({ onlyJobsInError }) => {
    let query = knex('job').select();
    if (onlyJobsInError) {
      query = query.whereNotNull('error_message');
    }
    return query;
  },
};

export default jobs;
