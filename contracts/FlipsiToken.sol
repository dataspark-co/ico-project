pragma solidity ^0.4.18;

import '../math/SafeMath.sol';
import './Ownable.sol';

/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
  uint256 public totalSupply;
  function balanceOf(address who) public constant returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public constant returns (uint256);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function approve(address spender, uint256 value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances. 
 */
contract BasicToken is ERC20Basic {
    
  using SafeMath for uint256;

  mapping(address => uint256) balances;

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of. 
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public constant returns (uint256 balance) {
    return balances[_owner];
  }

}

/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev https://github.com/ethereum/EIPs/issues/20
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract StandardToken is ERC20, BasicToken {

  mapping (address => mapping (address => uint256)) allowed;

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amout of tokens to be transfered
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    var _allowance = allowed[_from][msg.sender];

    // Check is not needed because sub(_allowance, _value) will already throw if this condition is not met
    // require (_value <= _allowance);

    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    allowed[_from][msg.sender] = _allowance.sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Aprove the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value) public returns (bool) {

    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender, 0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require((_value == 0) || (allowed[msg.sender][_spender] == 0));

    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifing the amount of tokens still available for the spender.
   */
  function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }

}


/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract BurnableToken is StandardToken {

    event Burn(address indexed burner, uint256 value);

    /**
     * @dev Burns a specific amount of tokens.
     * @param _value The amount of token to be burned.
     */
    function burn(uint256 _value) public {
        require(_value > 0);
        require(_value <= balances[msg.sender]);
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(burner, _value);
    }
}

contract FlipsiToken is BurnableToken, Ownable {
    
    string public constant name = "Flipsi Token";
    string public constant symbol = "FLP";
    uint32 public constant decimals = 8;
    uint256 public initialSupply = 20000000 * 10**8;
    
    uint256 public crowdSaleAllowance =  12000000 * 10**8;      // the number of tokens available for crowdsales
    uint256 public bountyAllowance =  1000000 * 10**8;          // the number of tokens available for the bounty program
    
    address public crowdSaleAddr;            //address of smart-contract what making crowdsale
    address public bountyAddr;               // the address of a guy who send bounty tokens
    bool    public transferEnabled = false; // indicates if transferring tokens is enabled or not

    event SetSaleAgent(address agent, uint256 value);
    event SetBountyAdminAddr(address admin, uint256 value);
    event AllowTransfer();

      // Modifiers
    modifier onlyWhenTransferEnabled() {
        if (!transferEnabled) {
            require(msg.sender == bountyAddr || msg.sender == crowdSaleAddr);
        }
        _;
    }
    
    function FlipsiToken(address founders, address team, address devteam) public {
        totalSupply = initialSupply;
        balances[msg.sender] = initialSupply;
        super.transfer(founders, initialSupply.div(10)); // 10%
        super.transfer(team, initialSupply.div(10)); // 10%
        super.transfer(devteam, initialSupply.div(200)); // 0.5%
    }

    /**
     * Associates this token with a current crowdsale, giving the crowdsale
     * an allowance of tokens from the crowdsale supply. This gives the
     * crowdsale the ability to call transferFrom to transfer tokens to
     * whomever has purchased them.
     *
     * Note that if _amountForSale is 0, then it is assumed that the full
     * remaining crowdsale supply is made available to the crowdsale.
     *
     * @param _crowdSaleAddr The address of a crowdsale contract that will sell this token
     * @param _amountForSale The supply of tokens provided to the crowdsale
     */
    function setSaleAgent(address _crowdSaleAddr, uint256 _amountForSale) external onlyOwner {
        require(!transferEnabled);
        require(_amountForSale <= crowdSaleAllowance);

        // if 0, then full available crowdsale supply is assumed
        uint amount = (_amountForSale == 0) ? crowdSaleAllowance : _amountForSale;

        // Clear allowance of old, and set allowance of new
        approve(crowdSaleAddr, 0);
        approve(_crowdSaleAddr, amount);

        crowdSaleAddr = _crowdSaleAddr;

        SetSaleAgent(_crowdSaleAddr, amount);
    }
    
    function setBountyAdminAddr(address _bountyAddr, uint256 _amountForBounty) external onlyOwner {
        // Clear allowance of old, and set allowance of new
        require(!transferEnabled);
        require(_amountForBounty <= bountyAllowance);

        uint amount = (_amountForBounty == 0) ? bountyAllowance : _amountForBounty;

        approve(bountyAddr, 0);
        approve(_bountyAddr, amount);
        bountyAddr = _bountyAddr;

        SetBountyAdminAddr(_bountyAddr, amount);
    }

    function transferOwnership(address newOwner) public onlyOwner {
      super.transfer(newOwner, balanceOf(owner));
      allowed[newOwner][crowdSaleAddr] = allowed[msg.sender][crowdSaleAddr];
      allowed[msg.sender][crowdSaleAddr] = 0;
      allowed[newOwner][bountyAddr] = allowed[msg.sender][bountyAddr];
      allowed[msg.sender][bountyAddr] = 0;
      super.transferOwnership(newOwner);
    }

    
    /**
     * Overrides ERC20 transfer function with modifier that prevents the
     * ability to transfer tokens until after transfers have been enabled.
     */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(transferEnabled);
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public onlyWhenTransferEnabled returns (bool) {
        if (!transferEnabled) {
            require(_from == owner );
        }
        return super.transferFrom(_from, _to, _value);
    }
    /**
     * Enables the ability of anyone to transfer their tokens. This can
     * only be called by the token owner. Once enabled, it is not
     * possible to disable transfers.
     */
    function enableTransfer() external onlyOwner {
        transferEnabled = true;
        approve(crowdSaleAddr, 0);
        //approve(preSaleAddr, 0);
        approve(bountyAddr, 0);

        AllowTransfer();
    }
    
    /**
     * Overrides the burn function so that it cannot be called until after
     * transfers have been enabled.
     *
     * @param _value    The amount of tokens to burn in mini-QSP
     */
    function burn(uint256 _value) public  {
        require(msg.sender == owner);
        super.burn(_value);
    }
}
