pragma solidity ^0.5.0;

import "./BaseContentManagement.sol";

contract BookContentManagement is BaseContentManagement{

    bytes32 private encoding;
    uint private pages;
    
    constructor(bytes32 _title, bytes32 _author, bytes32 _encoding, uint _pages, address _catalogAddress, uint _price) public{
        title = _title;
        author = _author;
        genre = "626f6f6b";
        content.push(_encoding);
        content.push(bytes32(_pages));
        catalogAddress = _catalogAddress;
        catalog = Catalog(catalogAddress);
        catalog.LinkToTheCatalog(title, author, genre, _price);
    }
}

contract MovieContentManagement is BaseContentManagement{

    bytes32 private encoding;
    uint private bitrate;
    uint private duration;
    uint private width;
    uint private height;
    
    constructor(bytes32 _title, bytes32 _author, bytes32 _encoding, uint _bitrate, uint _duration,
    uint _width, uint _height, address _catalogAddress, uint _price) public{
        title = _title;
        author = _author;
        genre = "6d6f766965";
        content.push(_encoding);
        content.push(bytes32(_bitrate));
        content.push(bytes32(_duration));
        content.push(bytes32(_width));
        content.push(bytes32(_height));
        catalogAddress = _catalogAddress;
        catalog = Catalog(catalogAddress);
        catalog.LinkToTheCatalog(title, author, genre, _price);
    }
}

contract MusicContentManagement is BaseContentManagement{

    bytes32 private encoding;
    uint private bitrate;
    uint private duration;
    
    constructor(bytes32 _title, bytes32 _author, bytes32 _encoding, uint _bitrate, uint _duration, address _catalogAddress, uint _price) public{
        title = _title;
        author = _author;
        genre = "736f6e67";
        content.push(_encoding);
        content.push(bytes32(_bitrate));
        content.push(bytes32(_duration));
        catalogAddress = _catalogAddress;
        catalog = Catalog(catalogAddress);
        catalog.LinkToTheCatalog(title, author, genre, _price);
    }
}