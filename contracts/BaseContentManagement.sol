pragma solidity ^0.4.23;
import "./Catalog.sol";

contract BaseContentManagement {
    bytes32 public title;
    bytes32 public author;
    bytes32 public genre;
    bytes32[] internal content;
    address internal catalogAddress;
    Catalog internal catalog;

    event ConsumedContent(bytes32 _content, address _user);

    struct UserMetadata{
        bool allowed;
        bool consumed;
    }

    mapping (address => UserMetadata) users;

    modifier onlyIfAllowed(){
        require(
            users[msg.sender].allowed == true,
            "User not allowed"
        );
        _;
    }

    modifier isCatalog{
        require(
            msg.sender == catalogAddress,
            "Only the Catalog could perform this action!"
        );
        _;
    }

    function grantAccess(address _user) external isCatalog{
        users[_user].allowed = true;
        users[_user].consumed = false;
    }

    function consumeContent() external onlyIfAllowed() returns(bytes32[]){
        users[msg.sender].allowed = false;
        users[msg.sender].consumed = true;
        if(catalog.IsPremium(msg.sender)==false){
            catalog.AddViews(title);
        }
        emit ConsumedContent(title, msg.sender);
        return content;
    }

    function hasConsumed(address _user) external view returns(bool){
        return users[_user].consumed;
    }
    
}