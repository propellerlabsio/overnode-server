import blocks from './blocks';
import transactions from './transactions';
import addresses from './addresses';

const search = {
  simple: async ({ term }) => {
    // Build block search with massaged parameters
    let blockSearch;
    const termIsInteger = Number.isInteger(Number(term));
    if (termIsInteger) {
      blockSearch = blocks.get({ height: term });
    } else {
      let hash = term;
      if (hash.length === 47) {
        hash = `00000000000000000${hash}`;
      }
      blockSearch = blocks.get({ hash });
    }

    // Build transaction search
    const transationSearch = transactions.get({ transaction_id: term });


    // Build address search
    const addressSearch = addresses.get({ address: term });

    // Process all searches together but wait until all finished
    const [block, transaction, address] = await Promise.all([
      blockSearch,
      transationSearch,
      addressSearch,
    ]);

    // Return block || transaction || address;
    return {
      block,
      transaction,
      address,
    };
  },
};

export default search;
