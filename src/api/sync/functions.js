/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import adjust_data_1 from './adjust_data_1';
import populate_block_table from './populate_block_table';
import populate_transaction_tables from './populate_transaction_tables';

const functions = {
  populate_block_table,
  populate_transaction_tables,
  adjust_data_1,
};

export default functions;
