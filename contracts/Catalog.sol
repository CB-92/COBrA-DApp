pragma solidity ^0.5.0;
import "./BaseContentManagement.sol";

contract Catalog {
    address payable public creator;
    uint premiumTime;
    uint public premiumPrice;
    bytes32[] contentList;
    uint public paymentDelay;
    uint allTheViews;

    struct ContentMetadata{
        address payable authorAddress;
        bool isLinked;
        BaseContentManagement content;
        uint views;
        uint viewsSincePayed;
        uint averageRating;
        uint requestedPrice;
    }

    mapping(bytes32 => ContentMetadata) addedContents;

    constructor() public{
        creator = msg.sender;
        /* 1 day = (24 h * 60 min * 60 sec) / 14.93 seconds per block = 53788 blocks */
        premiumTime = 53788;
        premiumPrice = 500;
        paymentDelay = 5;
        allTheViews = 0;
        contentList = new bytes32[](0);
    }

    /* events */
    event AccessGranted(bytes32 _content, address _user);
    event NewLinkedContent(bytes32 _content, bytes32 _author, bytes32 _genre);
    event PaymentAvailable(bytes32 _content, address _owner);
    event ClosedCatalog();

    struct PremiumInfo{
        bool isPremium;
        uint blockNum;
    }

    /* user address => block number of premium subscription*/
    mapping (address => PremiumInfo) premiumUsers;

    enum Category {none, appreciation, quality, price}

    /*
    Content feedback includes 3 categories: appreciation of the content, content quality and price fairness.
    Each category could be rated with a score from 0 to 5.
    So maximum rating is 5*3=15.
    */
    struct MostRated{
        bytes32 average;
        uint averageValue;
        bytes32 price;
        uint priceValue;
        bytes32 quality;
        uint qualityValue;
        bytes32 appreciation;
        uint appreciationValue;
    }

    MostRated mostRated;
    mapping (bytes32 => MostRated) authorToMostRated;
    mapping (bytes32 => MostRated) genreToMostRated;
    mapping (address => bytes32[]) userInterests;

    /* modifier to restrict a functionality only to Premium users */
    modifier restrictToPremium{
        require(
            premiumUsers[msg.sender].isPremium &&
            (premiumUsers[msg.sender].blockNum + premiumTime) > block.number,
            "Access restricted to Premium accounts!"
        );
        _;
    }

    modifier ifLinkedContent(bytes32 _content){
        require(
            addedContents[_content].isLinked == true,
            "Content not linked to the catalog!"
        );
        _;
    }

    /* Functionalities restricted to catalog creator only */
    modifier onlyCreator{
        require(
            msg.sender == creator,
            "Only Catalog creator could perform this action"
        );
        _;
    }

    /* Check that the caller is the content */
    modifier onlyContent(bytes32 _content){
        require(
            addedContents[_content].authorAddress == msg.sender,
            "Action allowed only for content contract!"  
        );
        _;
    }

    /* Check content views */
    modifier checkViews(bytes32 _content){
        require(
            addedContents[_content].viewsSincePayed >= paymentDelay,
            "No views enough to be payed!"
        );
        _;
    }

    /* Check payment value: transaction refused if value < amount and if value > amount */
    modifier costs(uint _amount){
        require(
            msg.value == _amount,
            "You didn't pay the correct amount of money!"
        );
        _;
    }

    /* Check if the content list is empty */
    modifier ifNotEmpty{
        require(
            contentList.length != 0,
            "Content list is empty!"
        );
        _;
    }

    /* Check if an user already consumed a certain content */
    modifier onlyIfConsumed(bytes32 _content){
        require(
            addedContents[_content].content.hasConsumed(msg.sender),
            "You can leave a feedback only if you already consumed the content!"
            );
        _;
    }

    function getContentPrice(bytes32 _title) external view ifLinkedContent(_title) returns(uint){
        return addedContents[_title].requestedPrice;
    }

    function GetContentAddress(bytes32 _title) external view ifLinkedContent(_title) returns(address){
        return address(addedContents[_title].authorAddress);
    }

    function getCatalogAddress() external view returns(address){
        return address(this);
    }

    function NumberOfLinkedContents() external view returns(uint){
        return uint(contentList.length);
    }

    function LinkToTheCatalog(bytes32 _title, uint _requestedPrice) external {
        contentList.push(_title);
        addedContents[_title].authorAddress = msg.sender;
        addedContents[_title].content = BaseContentManagement(msg.sender);
        addedContents[_title].views = 0;
        addedContents[_title].viewsSincePayed = 0;
        addedContents[_title].isLinked = true;
        addedContents[_title].averageRating = 0;
        addedContents[_title].requestedPrice = _requestedPrice;
        emit NewLinkedContent(_title, addedContents[_title].content.author(), addedContents[_title].content.genre());
    }

    function GetStatistics() external view ifNotEmpty returns (bytes32[] memory, uint[] memory) {
        uint[] memory views = new uint[](contentList.length);
        for(uint i = 0; i < contentList.length; i++){
            views[i] = addedContents[contentList[i]].views;
        }
        return (contentList, views);
    }

    function GetContentList() external view returns (bytes32[] memory) {
        return contentList;
    }

    function GetNewContentsList(uint _x) external view ifNotEmpty returns (bytes32[] memory){
        bytes32[] memory latests = new bytes32[](_x);
        uint j = contentList.length - 1;
        for (uint i = _x - 1; i>=0; i--){
            latests[i] = contentList[j];
            j--;
            if(i==0) break;
        }
        return latests;
    }

    function GetLatestByGenre(bytes32 _genre) external view ifNotEmpty returns (bytes32){
        bytes32 tmp;
        for (uint i = contentList.length - 1; i>=0; i--){
            if (addedContents[contentList[i]].content.genre() == _genre){
                tmp = contentList[i];
                break;
            }
            if(i == 0)
                break;
        }
        return tmp;
    }

    function GetMostPopularByGenre(bytes32 _genre) external view ifNotEmpty returns (bytes32){
        uint max = 0;
        bytes32 tmp;
        for(uint i = 0; i<contentList.length; i++){
            if(addedContents[contentList[i]].content.genre() == _genre && 
            addedContents[contentList[i]].views > max){
                max = addedContents[contentList[i]].views;
                tmp = contentList[i];
            }
        }
        return tmp;
    }

    function GetLatestByAuthor(bytes32 _author) external view ifNotEmpty returns (bytes32){
        bytes32 tmp;
        for (uint i = contentList.length - 1; i>=0; i--){
            if (addedContents[contentList[i]].content.author() == _author){
                tmp = contentList[i];
                break;
            }
            if(i == 0)
                break;
        }
        return tmp;

    }

    function GetMostPopularByAuthor(bytes32 _author) external view ifNotEmpty returns(bytes32){
        uint max = 0;
        bytes32 tmp;
        for(uint i = 0; i<contentList.length; i++){
            if(addedContents[contentList[i]].content.author() == _author &&
            addedContents[contentList[i]].views > max){
                max = addedContents[contentList[i]].views;
                tmp = contentList[i];
            }
        }
        return tmp;
    }

    /* Returns the title of the most rated content according to a certain category
    (category is "none"  if not specified by the user and returns the average) */
    function GetMostRated(uint _category) external view returns(bytes32){
        if(_category == uint(Category.none)) return mostRated.average;
        else if (_category == uint(Category.appreciation)) return mostRated.appreciation;
        else if (_category == uint(Category.quality)) return mostRated.quality;  
        else return mostRated.price;
    }

    /* Returns the title of the most rated content  with a specific genre according to a certain category
    (category is "none"  if not specified by the user and returns the average) */
    function GetMostRatedByGenre(bytes32 _genre, uint _category) external view returns(bytes32){
        if(_category == uint(Category.none)) return genreToMostRated[_genre].average;
        else if (_category == uint(Category.appreciation)) return genreToMostRated[_genre].appreciation;
        else if (_category == uint(Category.quality)) return genreToMostRated[_genre].quality;  
        else return genreToMostRated[_genre].price;
    }

    function GetMostRatedByAuthor(bytes32 _author) external view returns(bytes32){
        return authorToMostRated[_author].average;
    }

    function GetMostRatedByAuthor(bytes32 _author, uint _category) external view returns(bytes32){
        if(_category == uint(Category.none)) return authorToMostRated[_author].average;
        else if (_category == uint(Category.appreciation)) return authorToMostRated[_author].appreciation;
        else if (_category == uint(Category.quality)) return authorToMostRated[_author].quality;  
        else return authorToMostRated[_author].price;
    }

    /* Deal with user preferences */

    function AddInterest(bytes32 _interest) external {
        userInterests[msg.sender].push(_interest);
    }

    function GetInterestsNum() external view returns(uint){
        return userInterests[msg.sender].length;
    }

    function GetInterests() external view returns(bytes32[] memory){
        return userInterests[msg.sender];
    }



    function LeaveFeedback(bytes32 _content, uint _price, uint _appreciation, uint _quality) external onlyIfConsumed(_content){
        uint average = (_price + _appreciation + _quality) / 3;
        bytes32 author = addedContents[_content].content.author();
        bytes32 genre = addedContents[_content].content.genre();
        /* for price base value */
        addedContents[_content].averageRating = average;

        /* absolute */

        /* no category */
        if(mostRated.averageValue < average){
            mostRated.averageValue = average;
            mostRated.average = _content;    
        }
        /* price fairness */
        if(mostRated.priceValue < _price){
            mostRated.priceValue = _price;
            mostRated.price = _content;
        }
        /* content quality */
        if(mostRated.qualityValue < _quality){
            mostRated.qualityValue = _quality;
            mostRated.quality = _content;
        }
        /* appreciation of the content */
        if(mostRated.appreciationValue < _appreciation){
            mostRated.appreciationValue = _appreciation;
            mostRated.appreciation = _content;
        }

        /* genre */

        /* no category */
        if(genreToMostRated[genre].averageValue < average){
            genreToMostRated[genre].averageValue = average;
            genreToMostRated[genre].average = _content;    
        }
        /* price fairness */
        if(genreToMostRated[genre].priceValue < _price){
            genreToMostRated[genre].priceValue = _price;
            genreToMostRated[genre].price = _content;
        }
        /* content quality */
        if(genreToMostRated[genre].qualityValue < _quality){
            genreToMostRated[genre].qualityValue = _quality;
            genreToMostRated[genre].quality = _content;
        }
        /* appreciation of the content */
        if(genreToMostRated[genre].appreciationValue < _appreciation){
            genreToMostRated[genre].appreciationValue = _appreciation;
            genreToMostRated[genre].appreciation = _content;
        }

        /* author */

        /* no category */
        if(authorToMostRated[author].averageValue < average){
            authorToMostRated[author].averageValue = average;
            authorToMostRated[author].average = _content;    
        }
        /* price fairness */
        if(authorToMostRated[author].priceValue < _price){
            authorToMostRated[author].priceValue = _price;
            authorToMostRated[author].price = _content;
        }
        /* content quality */
        if(authorToMostRated[author].qualityValue < _quality){
            authorToMostRated[author].qualityValue = _quality;
            authorToMostRated[author].quality = _content;
        }
        /* appreciation of the content */
        if(authorToMostRated[author].appreciationValue < _appreciation){
            authorToMostRated[author].appreciationValue = _appreciation;
            authorToMostRated[author].appreciation = _content;
        }
    }

    function IsPremium(address _user) external view returns (bool){
        if(premiumUsers[_user].isPremium && 
        (premiumUsers[_user].blockNum + premiumTime > block.number))
        return true;
        else return false;
    }

    function GetContent(bytes32 _content) external payable costs(addedContents[_content].requestedPrice)
        ifLinkedContent(_content) returns (address){
        addedContents[_content].content.grantAccess(msg.sender);
        emit AccessGranted(_content, msg.sender);
        return addedContents[_content].authorAddress;
    }

    function GetContentPremium(bytes32 _content) external restrictToPremium  ifLinkedContent(_content) returns (address){
        addedContents[_content].content.grantAccess(msg.sender);
        emit AccessGranted(_content, msg.sender);
        return addedContents[_content].authorAddress;
    }

    function GiftContent(bytes32 _content, address _user) external payable costs(addedContents[_content].requestedPrice)
        ifLinkedContent(_content) returns(address){
        addedContents[_content].content.grantAccess(_user);
        emit AccessGranted(_content, _user);
        return addedContents[_content].authorAddress;
    }

    function GiftPremium(address _user) external payable costs(premiumPrice) {
        premiumUsers[_user].isPremium = true;
        premiumUsers[_user].blockNum = block.number;
    }

    function BuyPremium() external payable costs(premiumPrice){
        premiumUsers[msg.sender].isPremium = true;
        premiumUsers[msg.sender].blockNum = block.number;
    }

    /* Add views to a content and emit an event if it reaches the views for a payment */
    function AddViews(bytes32 _content) external onlyContent(_content){
        addedContents[_content].views++;
        addedContents[_content].viewsSincePayed++;
        allTheViews++;
        if(addedContents[_content].viewsSincePayed >= paymentDelay)
            emit PaymentAvailable(_content, addedContents[_content].authorAddress);
    }

    function CollectPayment(bytes32 _content) external checkViews(_content) onlyContent(_content) {
        /* base value = price*(avg rating / max rating) */
        msg.sender.transfer(addedContents[_content].requestedPrice * (addedContents[_content].averageRating/15));

        /* #views to be payed = #views since last time - #views payed this time 
            So no views are are lost between the notification of available payment and collecting the payment */
        addedContents[_content].viewsSincePayed = addedContents[_content].viewsSincePayed - paymentDelay; 
    }

    function ContentOwner(bytes32 _content) external view onlyContent(_content) returns(address payable) {
        return addedContents[_content].authorAddress;
    }

    function CloseCatalog() external onlyCreator{
        for(uint i = 0; i<contentList.length; i++){
            uint toTransfer = address(this).balance * addedContents[contentList[i]].views / allTheViews;
            addedContents[contentList[i]].authorAddress.transfer(toTransfer);
            emit ClosedCatalog();
        }
        selfdestruct(creator);
    }

}