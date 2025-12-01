// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

/**
 * @title IRealityETH
 * @dev Interface for Reality.eth Oracle Contract, does not include all functions
 * @notice This interface defines a partial set of the functions available in the 
 * Reality.eth oracle, including only those used by the Precog protocol.
 */
interface IRealityETH {
    /**
     * @dev Ask a question to the Reality.eth oracle
     * @param template_id The template ID for the question type
     * @param question The question text
     * @param arbitrator The arbitrator address for disputes
     * @param timeout The timeout period in seconds
     * @param opening_ts The opening timestamp
     * @param nonce A unique nonce for the question
     * @return question_id The unique identifier for the question
     */
    function askQuestion(
        uint256 template_id,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce
    ) external payable returns (bytes32 question_id);

    /**
     * @dev Ask a question with minimum bond
     * @param template_id The template ID for the question type
     * @param question The question text
     * @param arbitrator The arbitrator address for disputes
     * @param timeout The timeout period in seconds
     * @param opening_ts The opening timestamp
     * @param nonce A unique nonce for the question
     * @param min_bond The minimum bond required
     * @return question_id The unique identifier for the question
     */
    function askQuestionWithMinBond(
        uint256 template_id,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 min_bond
    ) external payable returns (bytes32 question_id);

    /**
     * @dev Submit an answer to a question
     * @param question_id The question ID to answer
     * @param answer The answer to submit
     * @param max_previous Maximum number of previous answers to consider
     */
    function submitAnswer(
        bytes32 question_id,
        bytes32 answer,
        uint256 max_previous
    ) external payable;

    /**
     * @dev Get the final answer for a question
     * @param question_id The question ID
     * @return The final answer
     */
    function getFinalAnswer(bytes32 question_id) external view returns (bytes32);

    /**
     * @dev Get the current result for a question
     * @param question_id The question ID
     * @return The current result
     */
    function resultFor(bytes32 question_id) external view returns (bytes32);

    /**
     * @dev Check if a question is finalized
     * @param question_id The question ID
     * @return True if the question is finalized
     */
    function isFinalized(bytes32 question_id) external view returns (bool);

    /**
     * @dev Get the best answer for a question
     * @param question_id The question ID
     * @return The best answer
     */
    function getBestAnswer(bytes32 question_id) external view returns (bytes32);

    /**
     * @dev Get the bond for a question
     * @param question_id The question ID
     * @return The bond amount
     */
    function getBond(bytes32 question_id) external view returns (uint256);

    /**
     * @dev Get the bounty for a question
     * @param question_id The question ID
     * @return The bounty amount
     */
    function getBounty(bytes32 question_id) external view returns (uint256);

    /**
     * @dev Get the arbitrator for a question
     * @param question_id The question ID
     * @return The arbitrator address
     */
    function getArbitrator(bytes32 question_id) external view returns (address);

    /**
     * @dev Get the timeout for a question
     * @param question_id The question ID
     * @return The timeout period
     */
    function getTimeout(bytes32 question_id) external view returns (uint32);

    /**
     * @dev Get the opening timestamp for a question
     * @param question_id The question ID
     * @return The opening timestamp
     */
    function getOpeningTS(bytes32 question_id) external view returns (uint32);

    /**
     * @dev Get the finalize timestamp for a question
     * @param question_id The question ID
     * @return The finalize timestamp
     */
    function getFinalizeTS(bytes32 question_id) external view returns (uint32);

    /**
     * @dev Get the content hash for a question
     * @param question_id The question ID
     * @return The content hash
     */
    function getContentHash(bytes32 question_id) external view returns (bytes32);

    /**
     * @dev Get the history hash for a question
     * @param question_id The question ID
     * @return The history hash
     */
    function getHistoryHash(bytes32 question_id) external view returns (bytes32);

    /**
     * @dev Get the minimum bond for a question
     * @param question_id The question ID
     * @return The minimum bond
     */
    function getMinBond(bytes32 question_id) external view returns (uint256);

    /**
     * @dev Check if a question is pending arbitration
     * @param question_id The question ID
     * @return True if pending arbitration
     */
    function isPendingArbitration(bytes32 question_id) external view returns (bool);

    /**
     * @dev Check if a question was settled too soon
     * @param question_id The question ID
     * @return True if settled too soon
     */
    function isSettledTooSoon(bytes32 question_id) external view returns (bool);

    /**
     * @dev Fund the answer bounty for a question
     * @param question_id The question ID
     */
    function fundAnswerBounty(bytes32 question_id) external payable;

    /**
     * @dev Create a template
     * @param content The template content
     * @return The template ID
     */
    function createTemplate(string calldata content) external returns (uint256);

    /**
     * @dev Create a template and ask a question
     * @param content The template content
     * @param question The question text
     * @param arbitrator The arbitrator address
     * @param timeout The timeout period
     * @param opening_ts The opening timestamp
     * @param nonce A unique nonce
     * @return question_id The question ID
     */
    function createTemplateAndAskQuestion(
        string calldata content,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce
    ) external payable returns (bytes32 question_id);

    /**
     * @dev Reopen a question
     * @param template_id The template ID
     * @param question The question text
     * @param arbitrator The arbitrator address
     * @param timeout The timeout period
     * @param opening_ts The opening timestamp
     * @param nonce A unique nonce
     * @param min_bond The minimum bond
     * @param reopens_question_id The question ID to reopen
     * @return question_id The new question ID
     */
    function reopenQuestion(
        uint256 template_id,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 min_bond,
        bytes32 reopens_question_id
    ) external payable returns (bytes32 question_id);

    /**
     * @dev Submit answer for another address
     * @param question_id The question ID
     * @param answer The answer
     * @param max_previous Maximum previous answers
     * @param answerer The answerer address
     */
    function submitAnswerFor(
        bytes32 question_id,
        bytes32 answer,
        uint256 max_previous,
        address answerer
    ) external payable;

    /**
     * @dev Submit answer by arbitrator
     * @param question_id The question ID
     * @param answer The answer
     * @param answerer The answerer address
     */
    function submitAnswerByArbitrator(
        bytes32 question_id,
        bytes32 answer,
        address answerer
    ) external;

    /**
     * @dev Assign winner and submit answer by arbitrator
     * @param question_id The question ID
     * @param answer The answer
     * @param payee_if_wrong The payee if wrong
     * @param last_history_hash The last history hash
     * @param last_answer_or_commitment_id The last answer or commitment ID
     * @param last_answerer The last answerer
     */
    function assignWinnerAndSubmitAnswerByArbitrator(
        bytes32 question_id,
        bytes32 answer,
        address payee_if_wrong,
        bytes32 last_history_hash,
        bytes32 last_answer_or_commitment_id,
        address last_answerer
    ) external;

    /**
     * @dev Submit answer commitment
     * @param question_id The question ID
     * @param answer_hash The answer hash
     * @param max_previous Maximum previous answers
     * @param _answerer The answerer address
     */
    function submitAnswerCommitment(
        bytes32 question_id,
        bytes32 answer_hash,
        uint256 max_previous,
        address _answerer
    ) external payable;

    /**
     * @dev Submit answer reveal
     * @param question_id The question ID
     * @param answer The answer
     * @param nonce The nonce
     * @param bond The bond
     */
    function submitAnswerReveal(
        bytes32 question_id,
        bytes32 answer,
        uint256 nonce,
        uint256 bond
    ) external;

    /**
     * @dev Claim winnings
     * @param question_id The question ID
     * @param history_hashes The history hashes
     * @param addrs The addresses
     * @param bonds The bonds
     * @param answers The answers
     */
    function claimWinnings(
        bytes32 question_id,
        bytes32[] calldata history_hashes,
        address[] calldata addrs,
        uint256[] calldata bonds,
        bytes32[] calldata answers
    ) external;

    /**
     * @dev Claim multiple and withdraw balance
     * @param question_ids The question IDs
     * @param lengths The lengths
     * @param hist_hashes The history hashes
     * @param addrs The addresses
     * @param bonds The bonds
     * @param answers The answers
     */
    function claimMultipleAndWithdrawBalance(
        bytes32[] calldata question_ids,
        uint256[] calldata lengths,
        bytes32[] calldata hist_hashes,
        address[] calldata addrs,
        uint256[] calldata bonds,
        bytes32[] calldata answers
    ) external;

    /**
     * @dev Withdraw balance
     */
    function withdraw() external;

    /**
     * @dev Get the Reality.eth balance of an account
     * @param account The address to check balance for
     * @return The balance of the account in Reality.eth
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Set question fee
     * @param fee The fee amount
     */
    function setQuestionFee(uint256 fee) external;

    /**
     * @dev Notify of arbitration request
     * @param question_id The question ID
     * @param requester The requester address
     * @param max_previous Maximum previous answers
     */
    function notifyOfArbitrationRequest(
        bytes32 question_id,
        address requester,
        uint256 max_previous
    ) external;

    /**
     * @dev Cancel arbitration
     * @param question_id The question ID
     */
    function cancelArbitration(bytes32 question_id) external;

    /**
     * @dev Get final answer if matches
     * @param question_id The question ID
     * @param content_hash The content hash
     * @param arbitrator The arbitrator address
     * @param min_timeout The minimum timeout
     * @param min_bond The minimum bond
     * @return The final answer if it matches
     */
    function getFinalAnswerIfMatches(
        bytes32 question_id,
        bytes32 content_hash,
        address arbitrator,
        uint32 min_timeout,
        uint256 min_bond
    ) external view returns (bytes32);

    /**
     * @dev Get result for once settled
     * @param question_id The question ID
     * @return The result once settled
     */
    function resultForOnceSettled(bytes32 question_id) external view returns (bytes32);

    // Events
    event LogNewQuestion(
        bytes32 indexed question_id,
        address indexed user,
        uint256 template_id,
        string question,
        bytes32 content_hash,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 created
    );

    event LogNewAnswer(
        bytes32 answer,
        bytes32 indexed question_id,
        bytes32 history_hash,
        address indexed user,
        uint256 bond,
        uint256 ts,
        bool is_commitment
    );

    event LogAnswerReveal(
        bytes32 indexed question_id,
        address indexed user,
        bytes32 answer_hash,
        bytes32 answer,
        uint256 nonce,
        uint256 bond
    );

    event LogFinalize(
        bytes32 indexed question_id,
        bytes32 answer
    );

    event LogClaim(
        bytes32 indexed question_id,
        address indexed user,
        uint256 amount
    );

    event LogFundAnswerBounty(
        bytes32 indexed question_id,
        uint256 bounty_added,
        uint256 bounty,
        address indexed user
    );

    event LogMinimumBond(
        bytes32 indexed question_id,
        uint256 min_bond
    );

    event LogNotifyOfArbitrationRequest(
        bytes32 indexed question_id,
        address indexed user
    );

    event LogCancelArbitration(
        bytes32 indexed question_id
    );

    event LogReopenQuestion(
        bytes32 indexed question_id,
        bytes32 reopened_question_id
    );

    event LogNewTemplate(
        uint256 indexed template_id,
        address indexed user,
        string question_text
    );

    event LogSetQuestionFee(
        address arbitrator,
        uint256 amount
    );

    event LogWithdraw(
        address indexed user,
        uint256 amount
    );
}
